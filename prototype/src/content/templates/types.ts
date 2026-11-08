import type { ReturnSituation, TenureStage } from '@/contracts/domain';

export interface NarrativeTemplate {
  id: string;
  situation: ReturnSituation;
  stages: TenureStage[] | 'ALL';
  figuresSummary: string;
  means: {
    title: string;
    body: string;
    takeaway?: string;
  };
  doesNotMean: {
    title: string;
    body: string;
    takeaway?: string;
  };
}

