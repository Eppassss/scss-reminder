# Scss Reminder

This is a vscode extension which helps you of using scss/sass variables & mixins.

---

## Features

- Remind defined variables/mixins

- Quick fix for replacement of defined variables/mixins

- Auto Completion of variables/mixins

- Support scss/sass syntax

---

## Demos

You will be reminded of the defined variables/mixins.

---

### reminder and quick-fix demo

- In this example, variables are defined in test.scss. You may click and go to the source file(test.scss) to check out the defined variable, or replace the property with the variable name just using quick fix.
![Demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/scss-reminder.gif?raw=true)

- Demo for mixins
![Mixin](https://github.com/patrickli147/demos/blob/main/scss-reminder/mixin_quickfix.gif?raw=true)

### auto completion demo

- *completion for variable value*
![auto completion demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/completion-value.gif?raw=true)

- *completion for variable name*
![auto completion demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/completion-variable.gif?raw=true)

- *completion for mixin name*
![auto completion demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/mixin_name.gif?raw=true)

- *completion for mixin content*
![auto completion demo](https://github.com/patrickli147/demos/blob/main/scss-reminder/mixin_content.gif?raw=true)

## Extension Settings

This extension contributes the following settings:

- `scssReminder.sourceFiles`: source file containing variables

You may select a file in your project as the source file.
![select a file](https://github.com/patrickli147/demos/blob/main/scss-reminder/selectModal.png?raw=true)

Or manually edit ./vscode/settings.json(use relative path to your root directory).
![settings.json](https://github.com/patrickli147/demos/blob/main/scss-reminder/settings.png?raw=true)
