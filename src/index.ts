import * as actions from './actions';

export default actions;

export interface MapEnvSettingsValue {
  [configName: string]: any;
}

export interface MapEnvSettings {
  [environmentName: string]: MapEnvSettingsValue;
}

export interface FirebaseRcProjects {
  [projectName: string]: string;
}

export interface FirebaseRc {
  projects?: FirebaseRcProjects;
  ci?: FirebaseCiSettings;
  targets?: any;
}

export interface FirebaseCiSettings {
  mapEnv?: MapEnvSettings;
  createConfig?: MapEnvSettings;
  skipToolsInstall?: boolean;
  skipFunctionsInstall?: boolean;
  toolsVersion?: string;
}

export interface FirebaseCiOptions {
  project?: string;
  path?: string;
  silence?: boolean;
  only?: string;
  simple?: boolean;
  // NOTE: Do not use, for internal use only
  test?: boolean;
}
