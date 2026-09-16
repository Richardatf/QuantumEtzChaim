OPENQASM 3.0;
include "stdgates.inc";

// QEC projection profile: ivritcode-openqasm-0.1
// IvritCode source: אור
qubit[3] q;
bit[3] result;

// א / Identity phase
p(0) q[0];
// ו / S phase
s q[1];
// ר / Controlled Y rotation
cry(pi/2) q[2], q[0];

result = measure q;
