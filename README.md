# Private DEX

![DEX System Flow](frontend/public/dex-system-flow.png)

## Portfolio Demo Mode

This project includes an **auto-whitelist feature** designed for portfolio demonstration purposes. When enabled, any wallet that connects to the application is automatically whitelisted, allowing senior developers and recruiters to test all features immediately without waiting for manual approval.

### How It Works

1. **Feature Flag**: Controlled via `NEXT_PUBLIC_AUTO_WHITELIST_ENABLED` environment variable
2. **Auto-Approval**: When a wallet connects, the system automatically:
   - Checks if the address is already whitelisted
   - If not, creates a new whitelist entry with "approved" status
   - Grants immediate access to all DEX features
3. **Visual Indicator**: A purple demo banner appears at the top of the page when enabled

### Configuration

**For Portfolio Demo** (current setup):
```env
NEXT_PUBLIC_AUTO_WHITELIST_ENABLED=true
```

**For Production** (requires manual approval):
```env
NEXT_PUBLIC_AUTO_WHITELIST_ENABLED=false
```

### Security Notes

- This feature is **NOT recommended for production** environments
- Only enable for portfolio demonstrations, local development, or testing
- In production, users should go through the proper whitelist request flow
- The demo banner clearly indicates when auto-whitelist is active

---
