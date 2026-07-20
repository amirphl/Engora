import apiService, { ApiResponse } from '../../services/api';
import {
  CreateBundleRequest,
  CreateBundleResponse,
  GetBundlePayload,
  GetBundleTagEvaluationStatusResponse,
  ListBundleTagScoresParams,
  ListBundleTagScoresResponse,
  ListBundlesParams,
  ListBundlesResponse,
  RequestBundleTagEvaluationResponse,
  UpdateBundleRequest,
  UpdateBundleResponse,
} from '../../types/bundle';

export const bundlesApi = {
  list: (params: ListBundlesParams, signal?: AbortSignal) =>
    apiService.listBundles(params, signal) as Promise<
      ApiResponse<ListBundlesResponse>
    >,
  get: (id: number, signal?: AbortSignal) =>
    apiService.getBundle(id, signal) as Promise<ApiResponse<GetBundlePayload>>,
  create: (payload: CreateBundleRequest) =>
    apiService.createBundle(payload) as Promise<
      ApiResponse<CreateBundleResponse>
    >,
  update: (id: number, payload: UpdateBundleRequest) =>
    apiService.updateBundle(id, payload) as Promise<
      ApiResponse<UpdateBundleResponse>
    >,
  requestTagEvaluation: (id: number) =>
    apiService.requestBundleTagEvaluation(id) as Promise<
      ApiResponse<RequestBundleTagEvaluationResponse>
    >,
  getTagEvaluationStatus: (id: number, signal?: AbortSignal) =>
    apiService.getBundleTagEvaluationStatus(id, signal) as Promise<
      ApiResponse<GetBundleTagEvaluationStatusResponse>
    >,
  listTagScores: (
    id: number,
    params: ListBundleTagScoresParams,
    signal?: AbortSignal
  ) =>
    apiService.listBundleTagScores(id, params, signal) as Promise<
      ApiResponse<ListBundleTagScoresResponse>
    >,
};

export default bundlesApi;
