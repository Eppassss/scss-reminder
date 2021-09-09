/**
 * @file language server
 * @author patrickli147
 */

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
	CodeActionKind,
	ExecuteCommandRequest,
	CodeActionRequest,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import {EServerRequest, EServerRequestMap} from './constants/serverRequests';

import loadVariables, {IVariableData} from './loadVariables';
import initCapabilities from './init/initCapabilities';
import init from './init/init';

import {ClientCapabilityConfig} from './models/ClientCapabilityConfig/index';

// constants
import {CSS_REMINDER} from './constants/common';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let rootUri: string | null = '';
// const filePath = './test.scss';

// variables
let cssVariables: Map<string, IVariableData> = new Map();
let cssTextDocument: TextDocument;
const clientCapabilityConfig = new ClientCapabilityConfig({});

connection.onInitialize(async (params: InitializeParams) => {
	const newConfig = initCapabilities(params);
	clientCapabilityConfig.update(newConfig);

	rootUri = params.workspaceFolders && params.workspaceFolders[0].uri;

	return init(clientCapabilityConfig);
});

connection.onInitialized(() => {
	if (clientCapabilityConfig.hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (clientCapabilityConfig.hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The Reminder settings
interface ReminderSettings {
	maxNumberOfProblems: number;
	sourceFile: string[];
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this Reminder
// but could happen with other clients.
const defaultSettings: ReminderSettings = { maxNumberOfProblems: 1000, sourceFile: ['./test.scss'] };
let globalSettings: ReminderSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ReminderSettings>> = new Map();

connection.onDidChangeConfiguration(async (change) => {
	if (clientCapabilityConfig.hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ReminderSettings>(
			(change.settings.scssReminder || defaultSettings)
		);
	}

	// Revalidate all open text documents
	await initReminder();
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ReminderSettings> {
	if (!clientCapabilityConfig.hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'scssReminder'
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
documents.onDidChangeContent(async (change) => {
	if (cssVariables.size === 0) {
		await initReminder();
	}
	validateTextDocument(change.document);
});

documents.onDidSave(async (e) => {
	if (e.document.uri === rootUri + cssTextDocument.uri) {
		// if the source file changes, initReminder again
		await initReminder();
		documents.all().forEach(validateTextDocument);
		return;
	}
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

async function initReminder() {
	const settings = await getDocumentSettings(rootUri as string);
	const {sourceFile} = settings;
	if (sourceFile.length === 0) {
		connection.sendRequest(EServerRequestMap[EServerRequest.SET_SOURCE_FILE]);
		return;
	}
	const path = sourceFile[0];

	const res = loadVariables(path);
	cssVariables = res.variables;
	cssTextDocument = res.cssTextDocument;
}

async function validateTextDocument(textDocument: TextDocument) {
	if (textDocument.uri === rootUri + cssTextDocument.uri) {
		const diagnostics: Diagnostic[] = [];
		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
		return;
	}

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	const settings = await getDocumentSettings(textDocument.uri);
	const text = textDocument.getText();

	cssVariables.forEach((value, key) => {
		const pattern = makeValidRegExpFromString(value.value);
		const variableName = key.slice(0, -1);

		let m: RegExpExecArray | null;

		while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
			problems++;
			const range = {
				start: textDocument.positionAt(m.index + m[1].length),
				end: textDocument.positionAt(m.index + m[0].length)
			};

			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Information,
				range,
				message: `'${m[2]}' is defined as '${variableName}'.`,
				source: CSS_REMINDER.DIAGNOSTIC_IDENTIFIER,
				data: variableName
			};

			if (clientCapabilityConfig.hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: rootUri + cssTextDocument.uri,
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
		const completions: CompletionItem[] = [];
		for (const [key, value] of cssVariables) {
			// completion of keys
			completions.push({
				label: key.slice(0, -1),
				kind: CompletionItemKind.Variable,
				data: value.origin
			});

			// completion of values
			completions.push({
				label: `${key.slice(0, -1)}`,
				kind: CompletionItemKind.Variable,
				data: value.origin,
				insertText: key.slice(0, -1),
				filterText: value.value
			});
		}
		return completions;
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		item.detail = item.data;
		return item;
	}
);

connection.onCodeAction(
	(params: CodeActionParams, ...rest): any => {
		if (params.context.diagnostics.length > 0) {
			const {textDocument, context} = params;
			const {diagnostics} = context;
			const codeActions: CodeAction[] = [];
			diagnostics.forEach((diagnostic) => {
				if (diagnostic.source === CSS_REMINDER.DIAGNOSTIC_IDENTIFIER) {
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

connection.onRequest('test-request', (...params) => {
	console.log('====');
	console.log(params);
	connection.sendRequest('server');
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
