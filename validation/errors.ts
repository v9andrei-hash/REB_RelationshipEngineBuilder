
export type ErrorType = 
  | 'PARSE_FAILURE' 
  | 'BOUNDS_EXCEEDED' 
  | 'FORBIDDEN_COMBINATION' 
  | 'ACT_CONSTRAINT_VIOLATED';

export interface ValidationError {
  type: ErrorType;
  stat?: string;
  value?: number;
  limit?: number;
  message: string;
}
