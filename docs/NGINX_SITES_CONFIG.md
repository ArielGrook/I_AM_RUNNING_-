# Nginx конфиг для *.iamrunning.online

## Файл: /etc/nginx/sites-available/sites.iamrunning.online

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name ~^(?<subdomain>.+)\.iamrunning\.online$;

    ssl_certificate /etc/letsencrypt/live/iamrunning.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iamrunning.online/privkey.pem;

    location / {
        proxy_pass http://localhost:3000/sites/$subdomain;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets from Next.js
    location /_next/ {
        proxy_pass http://localhost:3000/_next/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Применение

```bash
# Проверить конфиг
nginx -t

# Перезагрузить
systemctl reload nginx
```

## Wildcard SSL (если ещё нет)

```bash
certbot certonly --manual --preferred-challenges=dns \
  -d "*.iamrunning.online" -d "iamrunning.online"
```

## Как это работает

1. Пользователь открывает `https://marcenko-artiom.iamrunning.online`
2. Nginx извлекает subdomain = `marcenko-artiom`
3. Проксирует на `http://localhost:3000/sites/marcenko-artiom`
4. Next.js рендерит `app/sites/[slug]/page.tsx` с этим slug
5. Server component загружает проект из Supabase по slug
6. Client component рендерит через Craft.js Frame
