$headers = @{
    "Authorization" = "Bearer TTLnDj9LpzsZNkIZ9Jx3H3o5"
    "Content-Type" = "application/json"
}

$body = @{
    name = "mexicain59-website"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects" -Method POST -Headers $headers -Body $body
