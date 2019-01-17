import ElasticSearchView, { ElasticSearchViewResponse } from "./ElasticSearchView";
import SparqlView, { SparqlViewResponse } from "./SparqlView";
import { httpGet } from "../utils/http";

export type ViewResponse = ElasticSearchViewResponse | SparqlViewResponse;

export interface ViewsListResponse {
  '@context'?: string | string[];
  _total: number;
  _results: (ElasticSearchViewResponse | SparqlViewResponse)[];
}

// IDs for the views that are automatically created with a project
const ES_DEFAULT_VIEW_ID = 'nxv:defaultElasticIndex';
const SPARQL_DEFAULT_VIEW_ID = 'nxv:defaultSparqlIndex';

const isElasticSearchView = (viewResponse: ViewResponse): viewResponse is ElasticSearchViewResponse => {
  const validTypes = ['ElasticView', 'AggregateElasticView'];
  return viewResponse['@type'].some(type => validTypes.includes(type));
}

const isSparqlView = (viewResponse: ViewResponse): viewResponse is SparqlViewResponse => {
  return viewResponse['@type'].some(type => type === 'SparqlView');
}

// The current API does not support pagination / filtering of views
// This should be fixed when possible and converted to signature
// Promise<PaginatedList<(ElasticSearchView | SparqlView)>>
export async function listViews(orgLabel: string, projectLabel: string): Promise<(ElasticSearchView | SparqlView)[]> {
  try {
    const viewURL = `/views/${orgLabel}/${projectLabel}`;
    const viewListResponse: ViewsListResponse = await httpGet(viewURL);
    const views: (ElasticSearchView | SparqlView)[] = viewListResponse._results
      .filter(viewResponse => isElasticSearchView(viewResponse) || isSparqlView(viewResponse))
      .map(
        viewResponse =>
          isElasticSearchView(viewResponse) ? new ElasticSearchView(
            orgLabel,
            projectLabel,
            viewResponse as ElasticSearchViewResponse,
          ) : new SparqlView(
            orgLabel,
            projectLabel,
            viewResponse as SparqlViewResponse,
          )
        );
    return views;
  } catch (error) {
    throw error;
  }
}

/**
 * Get any valid view of a project.
 *
 * Valid view types are ElasticSearch view and SPARQL view.
 *
 * TODO: refactor once we can fetch views per IDs (broken just now)
 */
export async function getView(orgLabel: string, projectLabel: string, viewId: string): Promise<ElasticSearchView | SparqlView> {
  try {
    const views = await listViews(orgLabel, projectLabel);
    const view = views.find(view => view.id === viewId);

    if (!view) {
      throw new Error(`Not found: view "${viewId}" for project "${projectLabel}" in organization "${orgLabel}"`);
    }

    return view;
  } catch (error) {
    throw error;
  }
}

/**
 * Get an ElasticSearch view of a project.
 *
 * Without viewId parameter, will get the default ElasticSearch view
 * that is created automatically with a project and is usually
 * the one to query to load resources.
 */
export async function getElasticSearchView(orgLabel: string, projectLabel: string, viewId: string = ES_DEFAULT_VIEW_ID): Promise<ElasticSearchView> {
  try {
    const view = await getView(orgLabel, projectLabel, viewId);

    if (!(view instanceof ElasticSearchView)) {
      throw new Error(`Incorrect type (not an ElasticSearch view): view "${viewId}" for project "${projectLabel}" in organization "${orgLabel}"`);
    }

    return view;
  } catch (error) {
    throw error;
  }
}

/**
 * Get the default (and only) SPARQL view of a project.
 *
 * Queries the triple-store (RDF) directly. For advanced uses.
 */
export async function getSparqlView(orgLabel: string, projectLabel: string): Promise<SparqlView> {
  try {
    const sparqlDefaultView = await getView(orgLabel, projectLabel, SPARQL_DEFAULT_VIEW_ID);
    if (!(sparqlDefaultView instanceof SparqlView)) {
        throw new Error(`Incorrect type (not a SPARQL view): view "${SPARQL_DEFAULT_VIEW_ID}" for project "${projectLabel}" in organization "${orgLabel}"`);
    }
    return sparqlDefaultView;
  } catch (error) {
    throw error;
  }
}