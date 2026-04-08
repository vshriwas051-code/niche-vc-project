const TrustTiers = {
  T0: { allowNetwork: false, allowExec: false, allowFsWrite: false, readOnlyDirs: ['/workspace'] },
  T1: { allowNetwork: true, allowExec: false, allowFsWrite: true, allowedDomains: ['api.openai.com'] },
  T2: { allowNetwork: true, allowExec: true, allowFsWrite: true, blockedBinaries: ['/bin/bash', '/bin/sh'] },
  T3: { allowNetwork: true, allowExec: true, allowFsWrite: true, requiresSig: true }
};

function evaluateSyscall(agentTier, syscall, args) {
  const tierConfig = TrustTiers[agentTier] || TrustTiers.T0;

  if (syscall === 'execve') {
    if (!tierConfig.allowExec) return 'BLOCK';
    if (tierConfig.blockedBinaries && tierConfig.blockedBinaries.some(b => args.includes(b))) return 'BLOCK';
  }
  
  if (syscall === 'openat') {
    if (args.includes('/etc/shadow') || args.includes('/etc/passwd')) return 'ALERT';
    if (args.includes('docker.sock')) return 'BLOCK';
  }

  if (syscall === 'connect') {
    if (!tierConfig.allowNetwork) return 'BLOCK';
    if (args.includes('169.254.169.254')) return 'BLOCK';
  }

  return 'ALLOW';
}

module.exports = { evaluateSyscall };
