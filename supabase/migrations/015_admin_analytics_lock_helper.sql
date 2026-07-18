-- Close a lint: the internal admin-check helper doesn't need to be callable
-- by anyone directly (it's only invoked from within the SECURITY DEFINER
-- analytics functions, which run as the function owner).
revoke all on function public._admin_analytics_is_admin() from public, anon, authenticated;
