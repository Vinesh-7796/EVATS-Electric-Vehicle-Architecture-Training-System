path = r'ev-bus-trainer app final DO NOT TOUCH\public\Flowchart 7 Updated.svg'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the style attribute background-color for dark mode
old_style = 'style="background: #FFFFFF; background-color: #FFFFFF; color-scheme: light dark;"'
new_style = 'style="background: #FFFFFF; background-color: #252525; color-scheme: light dark;"'
content = content.replace(old_style, new_style)

# 2. Replace the mxGraphModel background in the content attribute (uses " HTML entities)
old_bg = 'background=' + '"' + 'light-dark(#FFFFFF,#FFFFFF)' + '"'
new_bg = 'background=' + '"' + 'light-dark(#FFFFFF,#252525)' + '"'
content = content.replace(old_bg, new_bg)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done. Verifying...')
with open(path, 'r', encoding='utf-8') as f:
    c = f.read(600)
print(c)