with open('C:/Users/Usuario/Desktop/Barberia/src/database/store.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace \x08arber-;
text = text.replace('user.barberId || \x08arber-;', "user.barberId || ('barber-' + user.id);")
text = text.replace('u.barberId || \x08arber-;', "u.barberId || ('barber-' + u.id);")

marker = 'export const store = new DataStore();'
idx = text.find(marker)
if idx != -1:
    clean_text = text[:idx].rstrip() + '\n\n' + marker + '\nexport default store;\n'
    with open('C:/Users/Usuario/Desktop/Barberia/src/database/store.ts', 'w', encoding='utf-8') as f:
        f.write(clean_text)
    print('store.ts fixed successfully!')
else:
    print('Marker not found!')
