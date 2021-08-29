import {CodeActionKind, InitializeResult, TextDocumentSyncKind} from 'vscode-languageserver-protocol';
import {IClientCapabilityConfig} from '../models/ClientCapabilityConfig';

export default (clientCapabilityConfig: IClientCapabilityConfig) => {
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true
			},
			codeActionProvider: true,
			executeCommandProvider: {
				commands: []
			}
		}
	};
	if (clientCapabilityConfig.hasCodeActionLiteralsCapability) {
		result.capabilities.codeActionProvider = {
			codeActionKinds: [CodeActionKind.QuickFix]
		};
	}
	if (clientCapabilityConfig.hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
};
