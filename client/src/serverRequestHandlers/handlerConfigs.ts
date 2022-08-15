/**
 * @file This file contains the handler configurations of server requests
 * @author patrickli147
 */

// handlers
import {setSourceFiles, showErrorMessage} from '../actions';

export type ServerRequestHandler = (...args: any) => void;

export type handlerConfig = {
	/**
	 * The method of the request
	 */
	method: string,
	/**
	 * The handler of the request
	 */
	handler: ServerRequestHandler
}

export const handlerConfigs: handlerConfig[] = [
	{
		method: 'server-set-source-file',
		handler: setSourceFiles
	},
	{
		method: 'server-invoke-show-error-msg',
		handler: showErrorMessage
	}
];

