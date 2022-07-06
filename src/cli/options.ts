
export type CLIOptions = {
    command: string,
    options: string[],
    expression: string,
}

export type Command = {
    name: string,
    flags: string[],
    commandOptions?: string[][],
}

const commands: Command[] = [
    { name: 'parse', flags: ['-p', '--parse'], commandOptions: [[ 'strict', '-s', '--strict' ]] },
    { name: 'validate', flags: ['-v', '--validate'] },
    { name: 'normalize', flags: ['-n', '--normalize', '--normalise'] },
]

export const parseCLIOptions = (args: string[]): CLIOptions => {
    let params = [...args]
    let selectedCommand = commands[0]
    const options: CLIOptions = {
        command: selectedCommand.name,
        options: [],
        expression: args.join(' '),
    }

    // First, check if the command was provided explicitly:
    const explicitCommand = commands.find(cmd => cmd.flags.includes(params[0]))
    if (explicitCommand) {
        selectedCommand = explicitCommand
        options.command = selectedCommand.name
        params = params.slice(1)
    }

    // Then, consume any command-specific options:
    while (params[0].startsWith('-')) {
        const commandOption = (selectedCommand.commandOptions || []).find(opt => opt.slice(1).includes(params[0]))
        if (commandOption) {
            options.options.push(commandOption[0])
            params = params.slice(1)
        } else {
            throw new Error(`Option ${params[0]} is not supported by the ${selectedCommand.name} command.`)
        }
    }
    options.expression = params.join(' ')
    return options
}

export default parseCLIOptions
