/**
 * @file This file contains the server requests
 * @author  patrickli147
 */

export enum EServerRequest {
	/**
	 * Set source file in settings.json
	 */
	SET_SOURCE_FILE
}

export const EServerRequestMap: {[key in EServerRequest]: string} = {
	[EServerRequest.SET_SOURCE_FILE]: 'server-set-source-file'
};
