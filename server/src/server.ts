
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	CodeAction,
	Command,
	WorkspaceEdit,
	TextEdit,
	CodeActionParams,
	HandlerResult,
	WorkspaceChange,
	Position,
	ExecuteCommandParams,
	CodeActionKind
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import loadVariables, {IVariableData} from './loadVariables';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// const filePath = '/sass/_default.scss';
const filePath = './test.scss';

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let hasCodeActionLiteralsCapability = false;

// variables
let cssVariables: Map<string, IVariableData> | null = null;
let cssTextDocument: TextDocument;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;
	console.log(params);

	// load css variables
	const res = loadVariables(filePath);
	cssVariables = res.variables;
	cssTextDocument = res.cssTextDocument;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);
	hasCodeActionLiteralsCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.codeAction &&
		capabilities.textDocument.codeAction.codeActionLiteralSupport
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			codeActionProvider: true,
			executeCommandProvider: {
				commands: []
			}
		}
	};
	if (hasCodeActionLiteralsCapability) {
		result.capabilities.codeActionProvider = {
			codeActionKinds: [CodeActionKind.QuickFix]
		};
	}
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The Reminder settings
interface ReminderSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this Reminder
// but could happen with other clients.
const defaultSettings: ReminderSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ReminderSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ReminderSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ReminderSettings>(
			(change.settings.languageServerReminder || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ReminderSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerReminder'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

/**
 * create a RegExp to match css values
 * @param s given string
 * @returns regular expression
 */
function makeValidRegExpFromString(s: string) {
	const reg = /[\^$.*+?|\\/[\]{}()]/g;
	s = s.replace(reg, (match: string): string => {
		return `\\${match}`;
	});

	s = '(:\\s*)(' + s + ')';

	return new RegExp(s, "g");
}

async function validateTextDocument(textDocument: TextDocument) {
	if (!cssVariables) {
		return;
	}
	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	const settings = await getDocumentSettings(textDocument.uri);
	const text = textDocument.getText();

	cssVariables.forEach((value, key) => {
		const pattern = makeValidRegExpFromString(value.value);
		// console.log(pattern);
		const variableName = key.slice(0, -1);

		let m: RegExpExecArray | null;

		while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
			problems++;
			const range = {
				start: textDocument.positionAt(m.index + m[1].length),
				end: textDocument.positionAt(m.index + m[0].length)
			};
			const codeAction = CodeAction.create(
				'修复',
				{
					documentChanges: [
						{
							edits: [
								{
									range,
									newText: variableName
								}
							],
							textDocument
						}
					]
				},
				CodeActionKind.QuickFix
			);
			// const command = Command.create('replace', "testcommand");
			// console.log(">>>>>>");
			// console.log(codeAction);
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Information,
				range,
				message: `'${m[2]}' is defined as '${variableName}'.`,
				source: 'ex',
				data: variableName
			};
			const originalRange = {
				start: cssTextDocument.positionAt(value.start),
				end: cssTextDocument.positionAt(value.end)
			};
			if (hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: cssTextDocument.uri,
							range: {
								start: cssTextDocument.positionAt(value.start),
								end: cssTextDocument.positionAt(value.end)
							}
						},
						message: value.origin
					},
					{
						location: {
							uri: textDocument.uri,
							range: {
								start: textDocument.positionAt(m.index),
								end: textDocument.positionAt(m.index + m[0].length)
							}
						},
						message: `'${m[2]}' is defined as '${variableName}'.`
					}
				];
			}
			diagnostics.push(diagnostic);
		}
	});
	console.log(diagnostics.length);
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the Reminder we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

connection.onCodeAction(
	(params: CodeActionParams, ...rest): any => {
		console.log('code action');
		console.log(params);
		console.log(rest);
		console.log('code action ends');

		if (params.context.diagnostics.length > 0) {
			const {textDocument, context} = params;
			const {diagnostics} = context;
			const codeActions: CodeAction[] = [];
			diagnostics.forEach((diagnostic) => {
				// TODO: maintain CONSTANTS
				if (diagnostic.source === 'ex') {
					const {range, data} = diagnostic;
					codeActions.push(CodeAction.create(
						data as string,
						{
							changes: {
								[textDocument.uri]: [
									{
										range,
										newText: data as string
									}
								]
							}
						},
						CodeActionKind.QuickFix
					));
				}
			});

			return codeActions;
		}

		return [];
	}
);

connection.onExecuteCommand(
	(params: ExecuteCommandParams) => {
		console.log('command');
		console.log(params);
	}
);

connection.onCodeActionResolve((params): any => {
	console.log('code action resolve');
	console.log(params);
});

connection.onNotification(
	(params: any) => {
		console.log('notification');
		console.log(params);
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
