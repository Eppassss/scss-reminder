import {InitializeParams} from 'vscode-languageserver';

import {ClientCapabilityConfig} from '../models/ClientCapabilityConfig';

export default (params: InitializeParams) => {
	const clientCapabilityConfig = new ClientCapabilityConfig({});
	const capabilities = params.capabilities;

	const hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	const hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	const hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);
	const hasCodeActionLiteralsCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.codeAction &&
		capabilities.textDocument.codeAction.codeActionLiteralSupport
	);

	clientCapabilityConfig.update({
		hasConfigurationCapability,
		hasWorkspaceFolderCapability,
		hasDiagnosticRelatedInformationCapability,
		hasCodeActionLiteralsCapability
	});

	return clientCapabilityConfig;
};
