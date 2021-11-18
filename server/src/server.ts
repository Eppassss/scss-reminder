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
import loadMixins, {IMixinData} from './loadMixins';
import initCapabilities from './init/initCapabilities';
import init from './init/init';
import {validateMixins, validateVariables} from './validate/validate';

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
let mixins: Map<string, IMixinData> = new Map();
let cssTextDocument: TextDocument;
const textDocuments: TextDocument[] = [];

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
	sourceFiles: string[];
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this Reminder
// but could happen with other clients.
const defaultSettings: ReminderSettings = { maxNumberOfProblems: 1000, sourceFiles: ['./test.scss'] };
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

async function initReminder() {
	const sourceFiles = await getSourceFiles() as any;
	// TODO: multi source
	const path = sourceFiles[0];
	console.log(path);

	const res = loadVariables(path);
	const mixinsRes = loadMixins(path);

	cssVariables = res.variables;
	cssTextDocument = res.cssTextDocument;
	mixins = mixinsRes.mixins;
}

async function getSourceFiles() {
	const settings = await getDocumentSettings(rootUri as string);
	const {sourceFiles} = settings;
	if (sourceFiles.length === 0) {
		connection.sendRequest(EServerRequestMap[EServerRequest.SET_SOURCE_FILE]);
	}

	return sourceFiles;
}

async function validateTextDocument(textDocument: TextDocument) {
	if (textDocument.uri === rootUri + cssTextDocument.uri) {
		const diagnostics: Diagnostic[] = [];
		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
		return;
	}

	const problems = 0;
	const diagnostics: Diagnostic[] = [];
	const settings = await getDocumentSettings(textDocument.uri);
	const maxNumberOfProblems = settings.maxNumberOfProblems;
	const text = textDocument.getText();

	const commonValidateConfig = {
		hasDiagnosticRelatedInformationCapability: clientCapabilityConfig.hasDiagnosticRelatedInformationCapability,
		rootUri: rootUri as string
	};

	const variableDiagnostics = validateVariables(cssVariables, text,
		textDocument, maxNumberOfProblems - problems, commonValidateConfig);
	const mixinDiagnostics = validateMixins(mixins, text,
		textDocument, maxNumberOfProblems - problems, commonValidateConfig);

	diagnostics.push(...variableDiagnostics, ...mixinDiagnostics);

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

		for (const [key, value] of mixins) {
			// completion of mixin names
			completions.push({
				label: `@include ${key}`,
				kind: CompletionItemKind.Text,
				data: `@include ${key};`
			});

			// completion of mixin content
			completions.push({
				label: value.fullContent,
				kind: CompletionItemKind.Text,
				insertText: `@include ${key};`
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
