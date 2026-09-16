OPENQASM 3.1;
include "stdgates.inc";

// QEC projection profile: ivritcode-openqasm-0.2
// IvritCode source: שלומ
qubit[3] q;
bit[3] result;

// ש / Swap
swap q[0], q[1];
// ל / Y rotation
ry(pi/2) q[1];
// ו / S phase
s q[2];
// מ / Z rotation
rz(pi/2) q[0];

result = measure q;
