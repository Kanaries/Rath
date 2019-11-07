＃生成私钥key文件
openssl genrsa 1024 > ./safety/server.pem
//
＃通过私钥文件生成CSR证书签名
openssl req -new -key ./safety/server.pem -out ./safety/csr.pem
//
＃通过私钥文件和CSR证书签名生成证书文件
openssl x509 -req -days 365 -in ./safety/csr.pem -signkey ./safety/server.pem -out ./safety/server.crt