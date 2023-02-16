export interface IBackupFormHandler {
    submit: (download: boolean) => Promise<boolean>;
}

export interface IBackupFormProps {
    setBusy: (busy: boolean) => void;
    setCanBackup: (able: boolean) => void;
}
