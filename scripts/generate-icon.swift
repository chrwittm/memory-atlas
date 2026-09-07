// Original Memory Atlas artwork, licensed under Apache-2.0.
// Editable vector drawing; run: swift scripts/generate-icon.swift
import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let output = root.appendingPathComponent("assets/icon/MemoryAtlas.iconset")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat) -> NSColor {
    NSColor(srgbRed: r / 255, green: g / 255, blue: b / 255, alpha: 1)
}
func stroke(_ path: NSBezierPath, _ width: CGFloat, _ ink: NSColor) {
    ink.setStroke(); path.lineWidth = width; path.lineCapStyle = .round; path.stroke()
}
func render(_ pixels: Int, _ file: String) throws {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    let transform = AffineTransform(scale: CGFloat(pixels) / 1024)
    (transform as NSAffineTransform).concat()
    let background = NSBezierPath(roundedRect: NSRect(x: 64, y: 64, width: 896, height: 896), xRadius: 200, yRadius: 200)
    NSGradient(starting: color(20, 62, 72), ending: color(8, 25, 36))!.draw(in: background, angle: 80)
    let cream = color(238, 229, 206)
    let globe = NSRect(x: 218, y: 218, width: 588, height: 588)
    stroke(NSBezierPath(ovalIn: globe), 27, cream)
    stroke(NSBezierPath(ovalIn: NSRect(x: 367, y: 218, width: 290, height: 588)), 17, color(100, 158, 160))
    let equator = NSBezierPath(); equator.move(to: NSPoint(x: 224, y: 512)); equator.line(to: NSPoint(x: 800, y: 512))
    stroke(equator, 17, color(100, 158, 160))
    for y: CGFloat in [380, 644] {
        let latitude = NSBezierPath(); latitude.move(to: NSPoint(x: 253, y: y)); latitude.line(to: NSPoint(x: 771, y: y))
        stroke(latitude, 14, color(100, 158, 160))
    }
    // A warm compass needle makes the atlas recognizable without text.
    let north = NSBezierPath(); north.move(to: NSPoint(x: 651, y: 724)); north.line(to: NSPoint(x: 458, y: 505)); north.line(to: NSPoint(x: 541, y: 465)); north.close()
    color(242, 181, 101).setFill(); north.fill()
    let south = NSBezierPath(); south.move(to: NSPoint(x: 373, y: 300)); south.line(to: NSPoint(x: 458, y: 505)); south.line(to: NSPoint(x: 541, y: 465)); south.close()
    cream.setFill(); south.fill()
    color(10, 35, 45).setFill(); NSBezierPath(ovalIn: NSRect(x: 482, y: 482, width: 60, height: 60)).fill()
    NSGraphicsContext.restoreGraphicsState()
    try bitmap.representation(using: .png, properties: [:])!.write(to: output.appendingPathComponent(file))
}
for size in [16, 32, 128, 256, 512] {
    try render(size, "icon_\(size)x\(size).png")
    try render(size * 2, "icon_\(size)x\(size)@2x.png")
}
let process = Process(); process.executableURL = URL(fileURLWithPath: "/usr/bin/iconutil")
process.arguments = ["-c", "icns", output.path, "-o", root.appendingPathComponent("assets/icon/MemoryAtlas.icns").path]
try process.run(); process.waitUntilExit()
if process.terminationStatus != 0 { exit(process.terminationStatus) }
print("Generated MemoryAtlas.icns and ten iconset representations")
