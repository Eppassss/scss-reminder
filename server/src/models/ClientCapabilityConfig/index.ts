
export interface IClientCapabilityConfigSnapshot {
	hasConfigurationCapability: boolean;
	hasWorkspaceFolderCapability: boolean;
	hasDiagnosticRelatedInformationCapability: boolean;
	hasCodeActionLiteralsCapability: boolean;
}

export interface IClientCapabilityConfig extends IClientCapabilityConfigSnapshot {
	/**
     * update snapshot
     * @param d snapshot
     */
	update(d: Partial<IClientCapabilityConfigSnapshot>): void;

	/**
     * set hasConfigurationCapability
     * @param d hasConfigurationCapability
     */
	setHasConfigurationCapability(d: boolean): void;

	/**
     * set hasDiagnosticRelatedInformationCapability
     * @param d hasDiagnosticRelatedInformationCapability
     */
	setHasDiagnosticRelatedInformationCapability(d: boolean): void;

	/**
     * set hasWorkspaceFolderCapability
     * @param d hasWorkspaceFolderCapability
     */
	setHasWorkspaceFolderCapability(d: boolean): void;

	/**
     * set hasCodeActionLiteralsCapability
     * @param d hasCodeActionLiteralsCapability
     */
	setHasCodeActionLiteralsCapability(d: boolean): void;
}

export class ClientCapabilityConfig implements IClientCapabilityConfig {
	hasConfigurationCapability = false;
	hasDiagnosticRelatedInformationCapability = false;
	hasWorkspaceFolderCapability = false;
	hasCodeActionLiteralsCapability = false;

	constructor(d: Partial<IClientCapabilityConfigSnapshot>) {
		this.update(d);
	}

	update(d: Partial<IClientCapabilityConfigSnapshot>): void {
		Object.assign(this, d);
	}

	setHasConfigurationCapability(d: boolean): void {
		this.hasConfigurationCapability = d;
	}

	setHasWorkspaceFolderCapability(d: boolean): void {
		this.hasWorkspaceFolderCapability = d;
	}

	setHasDiagnosticRelatedInformationCapability(d: boolean): void {
		this.hasDiagnosticRelatedInformationCapability = d;
	}

	setHasCodeActionLiteralsCapability(d: boolean): void {
		this.hasCodeActionLiteralsCapability = d;
	}
}
