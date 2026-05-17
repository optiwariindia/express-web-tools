export default function configTest(essentialEnvironmentVariables: string[]): boolean {
    const { env } = process;
    let missingVariables = essentialEnvironmentVariables.filter(varName => !(varName in env));

    switch (missingVariables.length) {
        case 0:
            return true;
        case 1:
            throw new Error(`Misconfigured: Environment Variable ${missingVariables.join(",")} required`);

        default:
            let lastVar = missingVariables.pop();
            throw new Error(`Misconfigured: Environment Variables ${missingVariables.join(",")} and ${lastVar} are required`);
    }
}
