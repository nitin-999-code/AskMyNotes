import os
import re

# EMOJI REGEX
emoji_pattern = re.compile(
    "["
    u"\U0001f1e6-\U0001f1ff" # flags
    u"\U0001f300-\U0001f5ff" # symbols & pictographs
    u"\U0001f600-\U0001f64f" # emoticons
    u"\U0001f680-\U0001f6ff" # transport & map symbols
    u"\U0001f700-\U0001f77f" # alchemical symbols
    u"\U0001f780-\U0001f7ff" # Geometric Shapes Extended
    u"\U0001f800-\U0001f8ff" # Supplemental Arrows-C
    u"\U0001f900-\U0001f9ff" # Supplemental Symbols and Pictographs
    u"\U0001fa00-\U0001fa6f" # Chess Symbols
    u"\U0001fa70-\U0001faff" # Symbols and Pictographs Extended-A
    u"\u2600-\u26ff"         # Misc symbols
    u"\u2700-\u27bf"         # Dingbats
    u"\u2328"                # Keyboard
    u"\u23f0-\u23f3"
    u"\u23e9-\u23fa"
    u"\u2b50"
    u"\u2b55"
    u"\u2934-\u2935"
    u"\u200d"
    u"\ufe0f"                # VS16
    "]+", flags=re.UNICODE)

for root, dirs, files in os.walk('.'):
    # Exclude directories
    for exclude in ['.git', 'node_modules', '.venv', 'venv', '__pycache__']:
        if exclude in dirs:
            dirs.remove(exclude)

    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.md', '.txt', '.css')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if emoji_pattern.search(content):
                    print(f"Found emoji in {path}")
                    new_content = emoji_pattern.sub('', content)
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
            except Exception as e:
                print(f"Error on {path}: {e}")
