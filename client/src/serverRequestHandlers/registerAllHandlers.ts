/**
 * @file This file exports a module that register all server request handlers
 * @author  patrickli147
 */

import {LanguageClient} from 'vscode-languageclient/node';
import {handlerConfigs, handlerConfig} from './handlerConfigs';
import {registerServerRequestHandler} from './registerServerRequestHandler';

/**
 * This function registers all server request handlers
 *
 * @param client - language client instance
 * @returns void
 */
export const registerAllHandlers = (client: LanguageClient): void => {
	handlerConfigs.forEach((item: handlerConfig) => {
		const {method, handler} = item;
		registerServerRequestHandler(client, method, handler);
	});
};
