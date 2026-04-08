package main

import (
	"log"
	"fmt"
)

//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -target bpfeb -cc clang bpf bpf/probe.c -- -I../headers

func main() {
    fmt.Println("========================================")
    fmt.Println(" ARG Probe (eBPF Telemetry Node)")
    fmt.Println("========================================")
    fmt.Println("WARNING: Executing on Windows environment.")
    fmt.Println("eBPF requires a Linux kernel (>= 5.8) to attach SYS_ENTER_EXECVE.")
    fmt.Println("To test natively, compile this package in WSL2 or a native Linux VM:")
    fmt.Println("$ go generate && go build")
    fmt.Println()
	log.Println("Probe scaffolding initialized successfully. Mocking active for Windows.")
}
