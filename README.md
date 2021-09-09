# scss reminder

## Features

- Remind of defined variables

- Quick fix for replacement of defined variables

- Auto Completion

- Support scss/sass syntax

### quick fix demo

You will be reminded of the property defined as a variable. In this example, variables are defined in test.scss. You may click and go to the source file(test.scss) to check out the defined variable, or replace the property with the variable name just using quick fix.
![Demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/scss-reminder.gif?raw=true)

### auto completion demo

*completion of css variable values*
![auto completion demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/completion-value.gif?raw=true)

*completion of css variable names*
![auto completion demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/completion-variable.gif?raw=true)

## Extension Settings

This extension contributes the following settings:

- `scssReminder.sourceFile`: source file containing variables

You may select a file in your project as the source file.
![select a file](https://github.com/patrickli147/demos/blob/main/scss-reminder/selectModal.png?raw=true)

Or manually edit ./vscode/settings.json(use relative path to your root directory).
![settings.json](https://github.com/patrickli147/demos/blob/main/scss-reminder/settings.png?raw=true)
