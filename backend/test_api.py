import urllib.request
import json
import re

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/chat/',
    data=b'{"message":"hello"}',
    headers={'Content-Type': 'application/json'}
)
try:
    urllib.request.urlopen(req)
    print("Success")
except Exception as e:
    html = e.read().decode('utf-8')
    title = re.search(r'<title>(.*?)</title>', html)
    print("Title:", title.group(1) if title else "Unknown")
    exc_type = re.search(r'<th>Exception Type:</th>\s*<td>(.*?)</td>', html, re.DOTALL)
    print("Exception Type:", exc_type.group(1).strip() if exc_type else "Unknown")
    exc_value = re.search(r'<th>Exception Value:</th>\s*<td><pre>(.*?)</pre></td>', html, re.DOTALL)
    if not exc_value:
        exc_value = re.search(r'<div class="exception_value">(.*?)</div>', html, re.DOTALL)
    print("Exception Value:", exc_value.group(1).strip() if exc_value else "Unknown")
    
    with open('error.html', 'w', encoding='utf-8') as f:
        f.write(html)
