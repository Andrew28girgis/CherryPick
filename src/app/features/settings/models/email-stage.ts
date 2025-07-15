export interface EmailStage {
  id: number;
  stageMessage: string;
  mailsCount?: number;
  inProgress?: boolean;
}
