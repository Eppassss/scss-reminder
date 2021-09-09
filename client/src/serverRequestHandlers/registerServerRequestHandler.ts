import {LanguageClient} from 'vscode-languageclient/node';
import {ServerRequestHandler} from './handlerConfigs';

/**
 * This function registers a handler for the given server request
 *
 * @param client - language client instance
 * @param method - request method
 * @param handler - handler for the request
 * @returns return-desc
 */
export const registerServerRequestHandler = async (
	client: LanguageClient,
	method: string,
	handler:ServerRequestHandler
) => {
	if (!client.initializeResult) {
		await client.onReady();
	}
	client.onRequest(method, handler);
};
