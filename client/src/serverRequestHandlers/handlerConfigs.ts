/**
 * @file This file contains the handler configurations of server requests
 * @author patrickli147
 */

// handlers
import {setSourceFiles} from '../actions/setSourceFiles';

export type ServerRequestHandler = () => void;

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
	}
];

