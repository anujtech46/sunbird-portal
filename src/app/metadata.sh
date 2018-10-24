#!/bin/sh
# return version
parent_path=$( cd "$(dirname "$0")" ; pwd -P )
check=$(cat ${parent_path}/package.json| jq -c '{name: .name , version: .dockerVersion, org: .author, hubuser: "anujtech46"}')
echo $check
