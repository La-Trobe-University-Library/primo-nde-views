//set the url of the server you want to test your code with and start the development server using the following command:
// ng serve --proxy-config ./proxy/proxy.conf.mjs   
const environments = {
    'ltu': 'https://latrobe.primo.exlibrisgroup.com/',
  }
  
  export const PROXY_TARGET = environments['ltu']; 