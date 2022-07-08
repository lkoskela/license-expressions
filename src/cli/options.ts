
export type CLIOptions = {
    command: string,
    options: string[],
    expression: string,
}

export type CommandOption = {
    name: string,
    flags: string[],
    description: string
}

export type Command = {
    name: string,
    flags: string[],
    commandOptions?: CommandOption[],
    description: string
}

const commands: Command[] = [
    {
        name: 'parse',
        flags: ['-p', '--parse'],
        commandOptions: [
            {
                name: 'strict',
                flags: ['-s', '--strict'],
                description: 'Use strict parsing rules'
            }
        ],
        description: 'Parse an expression into a structured object'
    },
    {
        name: 'validate',
        flags: ['-v', '--validate'],
        description: 'Validate the semantic correctness of an expression'
    },
    {
        name: 'normalize',
        flags: ['-n', '--normalize'],
        description: 'Normalize an expression into its canonical form'
    },
]

const longestFlagCombination = Math.max(...commands.map(cmd => {
    const optionsLength = Math.max(...(cmd.commandOptions || []).map(opt => opt.flags.join(', ').length))
    const commandLength = cmd.flags.join(', ').length
    return Math.max(optionsLength, commandLength)
}))

export const usage = (nameOfExecutable: string): string => {
    const rows: string[] = []
    rows.push(`Usage:  ${nameOfExecutable} [command] [options] EXPRESSION`)
    rows.push('')
    rows.push('Commands:')
    commands.forEach(cmd => {
        rows.push(`\n${cmd.flags.join(', ').padEnd(longestFlagCombination + 4)}\t${cmd.description}`)
        if (cmd.commandOptions && cmd.commandOptions.length > 0) {
            rows.push('\n  Options:')
            cmd.commandOptions.forEach(opt => {
                rows.push(`  ${opt.flags.join(', ').padEnd(longestFlagCombination)}\t${opt.description}`)
            })
        }
    })
    rows.push('')
    return rows.join('\n')
}

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
    while (params[0] && params[0].startsWith('-')) {
        const commandOption = (selectedCommand.commandOptions || []).find(opt => opt.flags.includes(params[0]))
        if (commandOption) {
            options.options.push(commandOption.name)
            params = params.slice(1)
        } else {
            throw new Error(`Option ${params[0]} is not supported by the ${selectedCommand.name} command.`)
        }
    }
    options.expression = params.join(' ')
    return options
}

export default parseCLIOptions
