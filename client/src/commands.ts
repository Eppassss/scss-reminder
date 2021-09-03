import setSourceFile from './actions/setSourceFiles';

type CommandConfig = {
    [key in string]: (...params: any[]) => void | Promise<void>;
};

export const commandConfigs: CommandConfig = {
	'scssReminder.setSourceFile': setSourceFile
};
