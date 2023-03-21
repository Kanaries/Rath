import json
import boto3

client = boto3.client('lambda')


def lambda_handler(event, context):
    func = event['func']
    if func == 'ping':
        return {
            "success": True
        }
    source_type = event['sourceType']
    uri = event['uri']
    credentials = event.get('credentials', None)
    database = event.get('db', None)
    table = event.get('table', None)
    schema = event.get('schema', None)
    rows_num = event.get('rowsNum', 20)
    sql = event.get('query', None)
    payload = {
        'uri': uri,
        'func': func,
        'sourceType': source_type,
        'db': database,
        'schema': schema,
        'table': table,
        'rowsNum': rows_num,
        'query': sql,
        'credentials': credentials,
    }
    response = client.invoke(
        FunctionName='arn:aws:lambda:ap-northeast-3:395189247077:function:connector-{0}'.format(source_type),
        InvocationType='RequestResponse',
        Payload=json.dumps(payload)
    )
    res = json.load(response['Payload'])
    if 'errorMessage' in res:
        return {
            'success': False,
            'message': res['errorType']+'\n'+res['errorMessage']
        }
    else:
        return {
            'success': True,
            'data': res
        }
