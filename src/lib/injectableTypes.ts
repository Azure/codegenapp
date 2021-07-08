/**
 * The types available for dependency injection.
 */
const InjectableTypes = {
  Config: Symbol.for("Config"),
  Logger: Symbol.for("Logger"),
  PipelineResultCol: Symbol.for("PipelineResultCol"),
};

export { InjectableTypes };
