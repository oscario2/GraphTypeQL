// @ts-skip
import { color, TColor } from './color.ts';

type TLogType = 'info' | 'debug' | 'warn' | 'success' | 'error';

const levels = ['minimal', 'normal', 'verbose'] as const;
export type TLogLevel = typeof levels[number];

const lmap = {} as Record<TLogLevel, number>;
levels.forEach((k, i) => (lmap[k] = i));

export class Logger {
    public trace?: boolean;
    private level: TLogLevel;
    private caller?: string;

    /**
     * construct with optional log level
     * @param {TLogLevel | undefined} level
     */
    constructor(level?: TLogLevel) {
        this.level = level || 'normal';
        if (this.least('verbose')) this.stack();
    }

    public info(...input: unknown[]) {
        this.log('info', ...input);
    }

    public debug(...input: unknown[]) {
        if (!this.least('verbose')) return;
        this.log('debug', ...input);
    }

    public success(...input: unknown[]) {
        if (!this.least('verbose')) return;
        this.log('success', ...input);
    }

    public warn(...input: unknown[]) {
        this.log('warn', ...input);
    }

    public error(...input: unknown[]) {
        this.log('error', ...input);
    }

    public mode(level: TLogLevel) {
        this.level = level;
    }

    /**
     * assign last caller to this log instance
     */
    private stack(): void {
        const stack = new Error().stack;
        const row = stack?.split('\n')[2];
        const caller = row?.match(/\/([\w\d_-]+)\.(ts|js)/);
        if (caller?.length) this.caller = caller[1];
    }

    /**
     * check if we're less or more than N level to print
     * @param {TLogLevel} min
     * @returns
     */
    private least(min: TLogLevel): boolean {
        if (lmap[min] <= lmap[this.level]) return true;
        return false;
    }

    /**
     * write to console
     * @param {TLogType} type
     * @param {unknown[]} input
     */
    private log(type: TLogType, ...input: unknown[]): void {
        const { trace, caller } = this;
        const pre = caller ? `[${caller}]: ` : '';

        const shade = this.getColor(type);
        const args = input.map(k =>
            typeof k == 'object' ? JSON.stringify(k) : String(k)
        );
        const out = color[shade](pre + args.join(' '));
        trace ? console.trace(out) : console.log(out);
    }

    /**
     * get color from mode
     * @param {TLogType} type
     * @returns
     */
    private getColor(type: TLogType): TColor {
        switch (type) {
            case 'info':
                return 'white';
            case 'debug':
                return 'brightBlue';
            case 'warn':
                return 'yellow';
            case 'success':
                return 'green';
            case 'error':
                return 'brightRed';
        }
    }
}

export const log = new Logger('normal');
