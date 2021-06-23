// @ts-skip
const chart = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underline: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        crimson: '\x1b[38m'
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        crimson: '\x1b[48m'
    }
};

class Colors {
    // red
    public red(input: unknown) {
        return this.process(chart.fg.red, input);
    }

    public brightRed(input: unknown) {
        return this.process(chart.bright + chart.fg.red, input);
    }

    public bgBrightRed(input: unknown) {
        return this.process(chart.bright + chart.bg.red, input);
    }

    // green
    public green(input: unknown) {
        return this.process(chart.fg.green, input);
    }

    // blue
    public brightBlue(input: unknown) {
        return this.process(chart.bright + chart.fg.blue, input);
    }

    // yellow
    public yellow(input: unknown) {
        return this.process(chart.fg.yellow, input);
    }

    public brightYellow(input: unknown) {
        return this.process(chart.bright + chart.fg.yellow, input);
    }

    // white
    public white(input: unknown) {
        return this.process(chart.fg.white, input);
    }

    public darkWhite(input: unknown) {
        return this.process(chart.dim + chart.fg.white, input);
    }

    // misc
    public underline(input: unknown) {
        return this.process(chart.underline, input);
    }

    private process(color: string, input: unknown) {
        return color + input + chart.reset;
    }
}

export const color = new Colors();
export type TColor = keyof InstanceType<typeof Colors>;
