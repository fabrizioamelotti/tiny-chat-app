import {ChatApi, Configuration, ConfigurationParameters} from "@/src/sdk/backend";

export default class BackendApiProvider {
  static #chatApi: ChatApi

  static #configurationParameters: ConfigurationParameters = {
    basePath: process.env.API_PATH,
  }

  public static get chatApi(): ChatApi {
    if (!BackendApiProvider.#chatApi) {
      BackendApiProvider.#chatApi = new ChatApi(
        new Configuration(BackendApiProvider.#configurationParameters),
      )
    }

    return BackendApiProvider.#chatApi
  }
}
