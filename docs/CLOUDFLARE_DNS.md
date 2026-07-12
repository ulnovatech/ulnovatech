# DNS — superseded by temporary IP access

**Production no longer uses InfinityFree / `ulnovatech.store`.**

Current access model: GCE IP + nip.io hostnames — see **[`ACCESS.md`](./ACCESS.md)**.

When you buy a new domain, point A records at **`34.66.94.12`**, then update nginx `server_name` and env URLs. Optional Cloudflare Free edge (Flexible SSL while origin is HTTP `:80`) can be added at that time.
