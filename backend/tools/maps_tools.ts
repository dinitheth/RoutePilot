// Source: Google Maps Platform Code Assist
// Attribution: gmp_mcp_codeassist_v1_aistudio

import { searchPlacesLive, calculateRouteSegment } from '../services/maps_service.js';
import { PlaceCandidate, RouteSegment } from '../models/types.js';

export interface ADKTool<TInput, TOutput> {
  name: string;
  description: string;
  parametersSchema: Record<string, any>;
  execute: (input: TInput) => Promise<TOutput>;
}

export const searchPlacesTool: ADKTool<
  { query: string; category: string; maxResults?: number },
  { candidates: PlaceCandidate[]; totalFound: number; source: string }
> = {
  name: 'search_places',
  description: 'Search Google Maps Places API for physical businesses, banks, shops, or facilities matching criteria.',
  parametersSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term or query' },
      category: { type: 'string', description: 'BANK | SHOPPING | EDUCATION | FOOD | GENERAL' },
      maxResults: { type: 'number', description: 'Max number of places to retrieve' },
    },
    required: ['query', 'category'],
  },
  execute: async ({ query, category }) => {
    const candidates = await searchPlacesLive(query, category);
    return {
      candidates,
      totalFound: candidates.length,
      source: 'Google Maps Platform (Places API New)',
    };
  },
};

export const getRouteTool: ADKTool<
  {
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
    transportationMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  },
  RouteSegment
> = {
  name: 'get_route',
  description: 'Compute travel distance, duration, and road steps between two geographic locations using Routes API.',
  parametersSchema: {
    type: 'object',
    properties: {
      from: { type: 'object', properties: { name: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' } }, required: ['name', 'lat', 'lng'] },
      to: { type: 'object', properties: { name: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' } }, required: ['name', 'lat', 'lng'] },
      transportationMode: { type: 'string', enum: ['DRIVING', 'WALKING', 'TRANSIT', 'BICYCLING'] },
    },
    required: ['from', 'to'],
  },
  execute: async ({ from, to, transportationMode = 'DRIVING' }) => {
    return calculateRouteSegment(from, to, transportationMode);
  },
};
