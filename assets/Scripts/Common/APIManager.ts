import { _decorator, Component, Node } from 'cc';
import { APIConfig } from './APIConstant';
const { ccclass, property } = _decorator;

@ccclass('APIManager')
export class APIManager extends Component {
    private static getPath(serviceKey: keyof typeof APIConfig.BASE_URLS, api: string): string {
        return APIConfig.BASE_URLS[serviceKey] + api;
    }
    public static getData(serviceKey, path, successCallback, errorCallback, needAuth = false) {
        const fullPath = this.getPath(serviceKey, path);
        const json = JSON.stringify({});
        this.callGet(fullPath, json, needAuth)
            .then(successCallback)
            .catch(errorCallback);
    }

    public static putData(serviceKey, path, param, successCallback, errorCallback, needAuth = false) {
        const json = JSON.stringify(param);
        const fullPath = this.getPath(serviceKey, path);
        this.callPut(fullPath, json, needAuth)
            .then(successCallback)
            .catch(errorCallback);
    }

    public static postData(serviceKey, path, param, successCallback, errorCallback, needAuth = false) {
        const json = JSON.stringify(param);
        const fullPath = this.getPath(serviceKey, path);
        this.callPost(fullPath, json, needAuth)
            .then(successCallback)
            .catch(errorCallback);
    }

    private static callGet(url, param, needAuth = true) {
        return this.xmlBase('GET', url, param, needAuth);
    }
    private static callPost(url, param, needAuth = true, callPrivy = false, privyToken = null) {
        return this.xmlBase('POST', url, param, needAuth, callPrivy, privyToken);
    }
    private static callPut(url, param, needAuth = true) {
        return this.xmlBase('PUT', url, param, needAuth);
    }

    private static xmlBase(method, url, param, needAuth = true, callPrivy = false, privyToken = null) {
        // console.log('xmlBase ', url)
        return new Promise(function (resolve, reject) {
            let http = new XMLHttpRequest();
            http.open(method, url, true);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            if (needAuth) {
                http.setRequestHeader('x-access-token', APIConfig.token);
            }
            else if (callPrivy) {
                http.setRequestHeader('x-access-token', privyToken);
            }
            //http.setRequestHeader('X-Auth-Token', APIConfig.token);
            // http.ontimeout = () => {
            //     return reject(3)
            // }
            http.onerror = () => {
                console.log('on error', http);
            }
            http.onreadystatechange = () => {
                if (http.readyState == 4) {
                    // console.log('api log: ', http.responseText);
                    if (http.status >= 200 && http.status < 400) {
                        let out = JSON.parse(http.responseText)
                        return (resolve(out))
                    }
                    else {
                        return reject(http.responseText);
                    }
                }
            }

            http.send(param);
        });
    }

    private xmlBaseXAuOnly(method, url, param, needAuth = true) {
        // console.log(APIConfig.token);
        return new Promise(function (resolve, reject) {
            let http = new XMLHttpRequest();
            http.open(method, url, true);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            if (needAuth) {
                http.setRequestHeader('X-Auth-Token', APIConfig.token);
            }
            http.onerror = () => {
                console.error('on error', http);
            }
            http.onreadystatechange = () => {
                if (http.readyState == 4) {
                    // console.log('api log: ', http.responseText);
                    if (http.status >= 200 && http.status < 400) {
                        let out = JSON.parse(http.responseText)
                        // console.log(out);
                        return (resolve(out))
                    }
                    else {
                        return reject(http.responseText);
                    }
                }
            }

            http.send(param);
        });
    }
}


