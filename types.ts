export interface Place {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  rating: string;
  sourceUri?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export enum SearchStatus {
  IDLE = 'IDLE',
  LOCATING = 'LOCATING',
  SEARCHING = 'SEARCHING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface SearchError {
  title: string;
  message: string;
}