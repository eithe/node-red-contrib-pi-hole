# Pi-hole node for Node-RED

> This node lets you easily interact with a local pi-hole installation.

The pi-hole node is similar to (and based on) the exec node, but lets you more easily interact with Pi-hole running on the same machine as Node-RED.

# Supported commands

Most of the pihole command options: Enable, disable, status, update, update Gravity, restart, flush logs, get version, search the adlist, logging options, whitelist/blacklist actions. You may also specify commands/extra parameters through msg.payload input and/or through the custom append option.


# TODO

- Implement all relevant Pi-hole command line options (ongoing).
- Return json formatted results from Pi-hole, not just stdout.
- Ability to control remote Pi-hole instances.
