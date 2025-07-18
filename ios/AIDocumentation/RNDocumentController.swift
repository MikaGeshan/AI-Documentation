import Foundation
import UIKit

@objc(RNDocumentController)
class RNDocumentController: NSObject {
  @objc func openDoc(_ filePath: NSString) {
    DispatchQueue.main.async {
      let url = URL(fileURLWithPath: filePath as String)
      let docController = UIDocumentInteractionController(url: url)
      if let rootVC = UIApplication.shared.keyWindow?.rootViewController {
        docController.presentOptionsMenu(from: rootVC.view.frame, in: rootVC.view, animated: true)
      }
    }
  }
}
