export enum logLevel {
  TRACE,  // this is a code smell if used in production. This should be used during development to track bugs, but never committed to your VCS.
  DEBUG,  // log at this level about anything that happens in the program. This is mostly used during debugging, and I’d advocate trimming down the number of debug statement before entering the production stage, so that only the most meaningful entries are left, and can be activated during troubleshooting.
  INFO,   // log at this level all actions that are user-driven, or system specific (ie regularly scheduled operations…)
  WARN,   // log at this level all events that could potentially become an error. For instance if one database call took more than a predefined time, or if an in-memory cache is near capacity. This will allow proper automated alerting, and during troubleshooting will allow to better understand how the system was behaving before the failure.
  ERROR   // log every error condition at this level. That can be API calls that return errors or internal error conditions.
}


export class Logger {
  static trace(module: string, method: string, ...log: any[]) {
    console.trace(`${new Date().toLocaleString()} \x1b[35m%s\x1b[0m`,`:: TRACE :: ${module}.${method} :: ${log}`)
  }

  static debug(module: string, method: string, ...log: any[]) {
    console.debug(`${new Date().toLocaleString()} \x1b[34m%s\x1b[0m`,`:: DEBUG :: ${module}.${method} :: ${log}`)
  }

  static info(module: string, method: string, ...log: any[]) {
    console.info(`${new Date().toLocaleString()} \x1b[32m%s\x1b[0m`,`:: INFO :: ${module}.${method} :: ${log}`)
  }

  static warn(module: string, method: string, ...log: any[]) {
    console.warn(`${new Date().toLocaleString()} \x1b[33m%s\x1b[0m`, `:: WARN :: ${module}.${method} :: ${log}`)
  }

  static error(module: string, method: string, ...log: any[]) {
    console.error(`${new Date().toLocaleString()} \x1b[31m%s\x1b[0m`, `:: ERROR :: ${module}.${method} :: ${log}`)
  }

}
