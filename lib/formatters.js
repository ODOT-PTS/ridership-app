export const formatRouteName = route => {
  const nameParts = [];

  if (route.route_short_name !== '' && route.route_short_name !== null) {
    nameParts.push(route.route_short_name);
  }

  if (route.route_long_name !== '' && route.route_long_name !== null) {
    nameParts.push(route.route_long_name);
  }

  return nameParts.join(' - ');
}
