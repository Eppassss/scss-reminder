/**
 * @file This file contains the server requests
 * @author  patrickli147
 */

export enum EServerRequest {
	/**
	 * Set source file in settings.json
	 */
	SET_SOURCE_FILE,

	/**
	 * show info msg
	 */
	SHOW_INFO_MSG
}

export const EServerRequestMap: {[key in EServerRequest]: string} = {
	[EServerRequest.SET_SOURCE_FILE]: 'server-set-source-file',
	[EServerRequest.SHOW_INFO_MSG]: 'server-invoke-show-error-msg'
};
